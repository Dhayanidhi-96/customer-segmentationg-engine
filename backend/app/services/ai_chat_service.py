"""
AI analyst chat service for segmentation insights.
"""

from typing import Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models.customer import Customer


class AIChatService:
    """Provides analyst-style answers with Groq when available and fallback otherwise."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY

    def ask(self, db: Session, message: str) -> Dict:
        context = self._build_context(db)
        if self.api_key:
            try:
                answer = self._ask_groq(message=message, context=context)
                return {"answer": answer, "used_groq": True, "fallback_reason": None}
            except Exception as exc:
                reason = f"Groq request failed: {str(exc)[:220]}"
                print(f"[AIChatService] {reason}")
                answer = self._fallback_answer(message=message, context=context)
                return {"answer": answer, "used_groq": False, "fallback_reason": reason}

        answer = self._fallback_answer(message=message, context=context)
        return {
            "answer": answer,
            "used_groq": False,
            "fallback_reason": "GROQ_API_KEY not configured in backend environment",
        }

    def _build_context(self, db: Session) -> Dict:
        total_customers = db.query(Customer).filter(Customer.is_active == True).count()
        stats = (
            db.query(
                func.avg(Customer.recency_days).label("avg_recency"),
                func.avg(Customer.frequency).label("avg_frequency"),
                func.avg(Customer.monetary_value).label("avg_monetary"),
                func.sum(Customer.monetary_value).label("total_revenue"),
            )
            .filter(Customer.is_active == True)
            .first()
        )

        segment_rows = (
            db.query(
                Customer.segment_name,
                func.count(Customer.id).label("count"),
                func.sum(Customer.monetary_value).label("revenue"),
            )
            .filter(Customer.is_active == True, Customer.segment_name.isnot(None))
            .group_by(Customer.segment_name)
            .order_by(func.count(Customer.id).desc())
            .limit(8)
            .all()
        )

        segments = [
            {
                "segment_name": row.segment_name,
                "count": int(row.count or 0),
                "revenue": float(row.revenue or 0),
            }
            for row in segment_rows
        ]

        return {
            "total_customers": int(total_customers),
            "avg_recency_days": round(float(stats.avg_recency or 0), 2),
            "avg_frequency": round(float(stats.avg_frequency or 0), 2),
            "avg_monetary_value": round(float(stats.avg_monetary or 0), 2),
            "total_revenue": round(float(stats.total_revenue or 0), 2),
            "segments": segments,
        }

    def _ask_groq(self, message: str, context: Dict) -> str:
        import importlib

        groq_module = importlib.import_module("groq")
        client = groq_module.Groq(api_key=self.api_key)
        system_prompt = (
            "You are a senior CRM and customer-segmentation analyst. "
            "Give concise, practical business advice based on provided metrics. "
            "If asked for actions, provide prioritized steps with expected impact."
        )
        user_prompt = (
            f"Business context: {context}\n\n"
            f"User question: {message}\n\n"
            "Answer in plain language with actionable recommendations."
        )

        models_to_try = [settings.GROQ_MODEL] + [m for m in settings.GROQ_FALLBACK_MODELS if m != settings.GROQ_MODEL]
        last_error = None

        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    temperature=0.3,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )
                return response.choices[0].message.content
            except Exception as exc:
                last_error = exc
                continue

        raise RuntimeError(f"All configured Groq models failed. Last error: {last_error}")

    def _fallback_answer(self, message: str, context: Dict) -> str:
        top_segment = context["segments"][0]["segment_name"] if context["segments"] else "Unsegmented"
        return (
            "Groq is not configured, so this response is generated from local analytics only. "
            f"You currently have {context['total_customers']} active customers with total revenue ${context['total_revenue']:.2f}. "
            f"Top segment by size is {top_segment}. "
            f"For your question ('{message}'), start with these actions: "
            "1) prioritize high-value or loyal segments with premium offers, "
            "2) run reactivation discount campaigns for high-recency segments, "
            "3) monitor send status and duplicate addresses before campaign launch."
        )


ai_chat_service = AIChatService()
