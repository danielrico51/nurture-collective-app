import ContactOptions from "@/components/Common/ContactOptions";

const CallToAction = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <ContactOptions
          variant="contact"
          formHref="/contact?audience=mom"
          bookingTitle="Maternal Support Introductory Call"
          bookingDescription="Pick a time that works for you — we'll learn about your needs and answer your questions. Calendar invites come from Daniel Rico."
        />
      </div>
    </section>
  );
};

export default CallToAction;
