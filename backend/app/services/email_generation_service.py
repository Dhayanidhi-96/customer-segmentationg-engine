import smtplib
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config import settings
from app.models.customer import Customer
from app.models.email_dispatch_log import EmailDispatchLog

class EmailGenerationService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY

    def generate_email(self, customer: Customer) -> dict:
        if self.api_key:
            try:
                return self._generate_with_groq(customer)
            except Exception as e:
                print(f"Groq API generation failed: {e}. Falling back to simulation.")
                return self._generate_simulated(customer)
        else:
            return self._generate_simulated(customer)
            
    def _generate_with_groq(self, customer: Customer) -> dict:
        from groq import Groq
        client = Groq(api_key=self.api_key)
        
        prompt = f"""
        You are an expert marketing copywriter. 
        Write a hyper-personalized email to {customer.name} who is mathematically grouped in the "{customer.segment_name}" segment in our database.
        Their vital metrics:
        - Recency: {customer.recency_days} days since last purchase
        - Frequency: {customer.frequency} purchases
        - Monetary Value: ${customer.monetary_value}
        
        Make it very engaging, professional, and directly address their specific behavior to drive a new conversion or retain them. 
        Format your response exactly as:
        SUBJECT: <your subject>
        BODY: <body>
        """
        
        models_to_try = [settings.GROQ_MODEL] + [m for m in settings.GROQ_FALLBACK_MODELS if m != settings.GROQ_MODEL]
        last_error = None
        response = None

        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=model_name,
                    temperature=0.7,
                )
                break
            except Exception as exc:
                last_error = exc
                continue

        if response is None:
            raise RuntimeError(f"All configured Groq models failed. Last error: {last_error}")

        content = response.choices[0].message.content
        
        parts = content.split("BODY:")
        subject = parts[0].replace("SUBJECT:", "").strip()
        
        # Sometimes standard LLMs put extra asterisks or markdown around "SUBJECT", we clean it:
        subject = subject.replace("**", "").replace('"', '')
        body = parts[1].strip() if len(parts) > 1 else content
        
        return {"subject": subject, "body": body, "is_simulated": False}

    def _generate_simulated(self, customer: Customer) -> dict:
        """Fallback simulated AI generator if no API key is provided"""
        # Sleep slightly to simulate API latency
        time.sleep(1.2)
        
        segment = str(customer.segment_name).lower()
        name = customer.name.split(' ')[0] if customer.name else "Valued Customer"
        
        if "champion" in segment or "loyal" in segment or "segment 2" in segment:
            subject = f"Exclusive VIP Access for You, {name} 🌟"
            body = f"Hi {name},\n\nWe noticed you've shopped with us {customer.frequency} times, making you one of our most valued VIPs! To thank you for your incredible loyalty and your recent purchase just {int(customer.recency_days)} days ago, we're giving you early access to our new collection.\n\nSince your total spend is over ${int(customer.monetary_value)}, we've automatically upgraded your tier.\n\nEnjoy 20% off your next order with code VIP20.\n\nBest,\nThe SegmentIQ Team"
        elif "risk" in segment or "hibernating" in segment or "lost" in segment or "segment 0" in segment:
            subject = f"We've missed you, {name}! Here's a special gift 🎁"
            body = f"Hi {name},\n\nIt's been {int(customer.recency_days)} days since we last saw you, and we wanted to check in. We value your past {customer.frequency} purchases with us and want to invite you back.\n\nHere is a special $25 credit toward your next purchase of $100 or more. Come see what's new!\n\nBest,\nThe SegmentIQ Team"
        elif "potential" in segment or "segment 1" in segment:
            subject = f"Ready for your next favorite item, {name}?"
            body = f"Hi {name},\n\nThanks for trying us out recently! We hand-picked some new recommendations based on your recent activity.\n\nSince your average order value is around ${int(customer.avg_order_value)}, we think you'll love these premium selections we just added.\n\nBest,\nThe SegmentIQ Team"
        else:
            subject = f"A special update for you, {name}"
            body = f"Hi {name},\n\nWe noticed your recent activity and wanted to reach out because you are a valued member of our community. We have some exciting new updates we think you'll love.\n\nCome check out the store when you have a chance!\n\nBest,\nThe SegmentIQ Team"
            
        return {"subject": subject, "body": body, "is_simulated": True}

    def send_discount_campaign(
        self,
        db: Session,
        segment_name: Optional[str],
        discount_percent: float,
        discount_code: Optional[str],
        campaign_id: Optional[str] = None,
        limit: Optional[int] = None,
        dry_run: bool = False,
        force_resend: bool = False,
    ) -> Dict:
        """Send or simulate segmented discount campaign with dedupe and log tracking."""
        active_campaign_id = campaign_id or f"cmp-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}"
        query = db.query(Customer).filter(Customer.is_active == True)
        if segment_name:
            query = query.filter(Customer.segment_name == segment_name)
        if limit:
            query = query.limit(limit)

        candidates = query.all()

        total_candidates = len(candidates)
        seen_emails = set()
        sent = 0
        simulated = 0
        skipped_duplicates = 0
        failed = 0
        valid_emails = 0

        for customer in candidates:
            email = (customer.email or "").strip().lower()
            if not email:
                continue

            valid_emails += 1
            duplicate_in_batch = email in seen_emails
            seen_emails.add(email)

            if duplicate_in_batch:
                skipped_duplicates += 1
                self._log_dispatch(
                    db,
                    campaign_id=active_campaign_id,
                    customer=customer,
                    email=email,
                    subject="Duplicate recipient skipped",
                    body_preview="Skipped duplicate email inside same campaign batch.",
                    delivery_status="skipped_duplicate",
                    provider_message="duplicate-in-batch",
                    is_duplicate=True,
                )
                continue

            if not force_resend:
                existing = (
                    db.query(EmailDispatchLog)
                    .filter(EmailDispatchLog.campaign_id == active_campaign_id, EmailDispatchLog.email == email)
                    .first()
                )
                if existing:
                    skipped_duplicates += 1
                    continue

            email_payload = self._build_discount_email(customer, discount_percent, discount_code)
            subject = email_payload["subject"]
            body = email_payload["body"]

            if dry_run:
                simulated += 1
                self._log_dispatch(
                    db,
                    campaign_id=active_campaign_id,
                    customer=customer,
                    email=email,
                    subject=subject,
                    body_preview=body[:240],
                    delivery_status="simulated",
                    provider_message="dry-run",
                    is_duplicate=False,
                )
                continue

            try:
                self._deliver_email(email, subject, body)
                sent += 1
                self._log_dispatch(
                    db,
                    campaign_id=active_campaign_id,
                    customer=customer,
                    email=email,
                    subject=subject,
                    body_preview=body[:240],
                    delivery_status="sent",
                    provider_message="smtp" if self._smtp_configured() else "simulated-local",
                    is_duplicate=False,
                )
            except Exception as exc:
                failed += 1
                self._log_dispatch(
                    db,
                    campaign_id=active_campaign_id,
                    customer=customer,
                    email=email,
                    subject=subject,
                    body_preview=body[:240],
                    delivery_status="failed",
                    provider_message=str(exc)[:255],
                    is_duplicate=False,
                )

        db.commit()

        return {
            "campaign_id": active_campaign_id,
            "target_segment": segment_name or "ALL",
            "total_candidates": total_candidates,
            "valid_emails": valid_emails,
            "sent": sent,
            "simulated": simulated,
            "skipped_duplicates": skipped_duplicates,
            "failed": failed,
        }

    def get_campaign_status(
        self,
        db: Session,
        campaign_id: Optional[str] = None,
        email: Optional[str] = None,
        limit: int = 100,
    ) -> Dict:
        """Return campaign/email delivery status summary and recent log rows."""
        query = db.query(EmailDispatchLog)
        if campaign_id:
            query = query.filter(EmailDispatchLog.campaign_id == campaign_id)
        if email:
            query = query.filter(EmailDispatchLog.email == email.strip().lower())

        logs = query.order_by(EmailDispatchLog.created_at.desc()).limit(limit).all()

        status_counts = {
            "sent": 0,
            "simulated": 0,
            "skipped_duplicate": 0,
            "failed": 0,
        }
        for item in logs:
            if item.delivery_status in status_counts:
                status_counts[item.delivery_status] += 1

        return {
            "campaign_id": campaign_id,
            "email": email,
            "total_logs": len(logs),
            "sent": status_counts["sent"],
            "simulated": status_counts["simulated"],
            "skipped_duplicates": status_counts["skipped_duplicate"],
            "failed": status_counts["failed"],
            "items": [
                {
                    "campaign_id": row.campaign_id,
                    "customer_id": row.customer_id,
                    "email": row.email,
                    "segment_name": row.segment_name,
                    "delivery_status": row.delivery_status,
                    "is_duplicate": row.is_duplicate,
                    "provider_message": row.provider_message,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in logs
            ],
        }

    def _build_discount_email(self, customer: Customer, discount_percent: float, discount_code: Optional[str]) -> Dict[str, str]:
        """Build a segment-aware discount message."""
        first_name = customer.name.split(" ")[0] if customer.name else "there"
        code = discount_code or f"SEG{int(discount_percent)}OFF"
        segment = (customer.segment_name or "Valued Customers").strip()

        if "champion" in segment.lower() or "loyal" in segment.lower() or "high" in segment.lower():
            bonus_line = "As one of our highest-value shoppers, you get first access before public launch."
        elif "at-risk" in segment.lower() or "hibernating" in segment.lower():
            bonus_line = "We have missed you. This invite is tailored to bring you back with meaningful value."
        else:
            bonus_line = "This offer is personalized from your shopping profile and current segment behavior."

        subject = f"{first_name}, your {int(discount_percent)}% exclusive segment offer is live"
        body = (
            f"Hi {first_name},\n\n"
            f"You are in our {segment} cohort. {bonus_line}\n\n"
            f"Use code {code} to unlock {discount_percent:.0f}% off on your next purchase.\n"
            f"Offer is valid for a limited period and applies to selected catalog items.\n\n"
            "Reply to this email if you want a curated recommendation list.\n\n"
            "Best regards,\n"
            "SegmentIQ Growth Team"
        )
        return {"subject": subject, "body": body}

    def _smtp_configured(self) -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)

    def _deliver_email(self, recipient_email: str, subject: str, body: str) -> None:
        """Send via SMTP when configured, otherwise simulate as successful."""
        if not self._smtp_configured():
            # Simulated mode keeps workflow testable without SMTP credentials.
            return

        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)

    def _log_dispatch(
        self,
        db: Session,
        campaign_id: str,
        customer: Customer,
        email: str,
        subject: str,
        body_preview: str,
        delivery_status: str,
        provider_message: Optional[str],
        is_duplicate: bool,
    ) -> None:
        existing = None

        # Session uses autoflush=False, so check in-memory pending rows first.
        for pending in db.new:
            if isinstance(pending, EmailDispatchLog) and pending.campaign_id == campaign_id and pending.email == email:
                existing = pending
                break

        if existing is None:
            existing = (
                db.query(EmailDispatchLog)
                .filter(EmailDispatchLog.campaign_id == campaign_id, EmailDispatchLog.email == email)
                .first()
            )

        # Keep campaign logging idempotent so duplicate recipients never crash the request.
        if existing:
            existing.customer_id = customer.customer_id
            existing.segment_name = customer.segment_name
            existing.subject = subject
            existing.body_preview = body_preview
            existing.delivery_status = delivery_status
            existing.provider_message = provider_message
            existing.is_duplicate = is_duplicate
            return

        log = EmailDispatchLog(
            campaign_id=campaign_id,
            customer_id=customer.customer_id,
            email=email,
            segment_name=customer.segment_name,
            subject=subject,
            body_preview=body_preview,
            delivery_status=delivery_status,
            provider_message=provider_message,
            is_duplicate=is_duplicate,
        )
        db.add(log)

email_generator = EmailGenerationService()
