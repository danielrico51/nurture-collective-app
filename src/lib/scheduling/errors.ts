export class SchedulingNotConfiguredError extends Error {
  constructor(message = "Google Calendar scheduling is not configured") {
    super(message);
    this.name = "SchedulingNotConfiguredError";
  }
}

export class SchedulingSlotUnavailableError extends Error {
  constructor(message = "That time is no longer available") {
    super(message);
    this.name = "SchedulingSlotUnavailableError";
  }
}
