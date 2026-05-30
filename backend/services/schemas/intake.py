from pydantic import BaseModel, Field, field_validator, model_validator


class IntakeSubmitRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = ""
    phone: str = ""
    email: str = ""
    service_requested: str = Field(min_length=1)
    message: str = ""
    source: str = "website"

    @field_validator("first_name", "last_name", "phone", "email", "service_requested", "message", "source", mode="before")
    @classmethod
    def strip_strings(cls, value):
        if value is None:
            return ""
        return str(value).strip()

    @field_validator("email", mode="after")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not value:
            return value
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower()

    @model_validator(mode="after")
    def phone_or_email_required(self):
        if not self.phone and not self.email:
            raise ValueError("phone or email is required")
        return self


class EnrichedIntakeLead(BaseModel):
    lead_id: str
    created_at: str
    updated_at: str
    status: str = "new"
    version: int = 1
    lead_source: str
    first_name: str
    last_name: str = ""
    phone: str = ""
    email: str = ""
    service_requested: str
    message: str = ""


class IntakeSubmitResponse(BaseModel):
    success: bool = True
    lead_id: str
    forwarded: bool = False
    stored: bool = False
