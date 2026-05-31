import Image from "next/image";

export default function MaintenanceScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcfaf7] px-6 py-16 text-coal">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,191,166,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_28%),linear-gradient(180deg,#fffdf9_0%,#f8f0e6_100%)]" />
      <div className="absolute -left-20 top-24 h-56 w-56 rounded-full bg-[#f4d9bd]/60 blur-3xl" />
      <div className="absolute -right-16 bottom-16 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative w-full max-w-3xl rounded-[36px] border border-[#e8dccd] bg-white/88 p-8 shadow-[0_32px_80px_rgba(17,24,39,0.10)] backdrop-blur md:p-12">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#efe5d8] pb-6">
          <Image
            src="/images/HairIQ-logo.png"
            alt="Hair IQ"
            width={148}
            height={42}
            priority
            className="h-auto w-[126px] object-contain md:w-[148px]"
          />
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-ember">
            Under Maintenance
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.38em] text-smoke">
            Store Update In Progress
          </p>
          <h1 className="max-w-2xl font-display text-2xl font-semibold leading-tight text-coal md:text-4xl">
            We are under maintenance and will be back soon.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-smoke md:text-lg">
            Our website and marketplace are temporarily unavailable while we make a few updates.
            Thank you for your patience.
          </p>
        </div>

        {/* <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#efe5d8] bg-[#fffaf5] p-5">
            <p className="font-semibold uppercase tracking-[0.24em] text-coal">Status</p>
            <p className="mt-2 text-sm leading-6 text-smoke">Scheduled update in progress</p>
          </div>
          <div className="rounded-2xl border border-[#efe5d8] bg-[#fffaf5] p-5">
            <p className="font-semibold uppercase tracking-[0.24em] text-coal">Access</p>
            <p className="mt-2 text-sm leading-6 text-smoke">Storefront and marketplace are paused</p>
          </div>
          <div className="rounded-2xl border border-[#efe5d8] bg-[#fffaf5] p-5">
            <p className="font-semibold uppercase tracking-[0.24em] text-coal">Note</p>
            <p className="mt-2 text-sm leading-6 text-smoke">Please check back shortly</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
