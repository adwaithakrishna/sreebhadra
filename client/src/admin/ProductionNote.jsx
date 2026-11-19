import { useState } from 'react';

export default function ProductionNote() {
  const [open, setOpen] = useState(false);
  return (
    <div role="note" className="mb-6 rounded-xl border border-sun bg-sun-100 px-4 py-3 text-sm text-[#4F3200]">
      <p>
        <strong>Before real bookings:</strong> this admin area uses a basic email/password session. It is <strong>not</strong> production-hardened until the items below are in place.{' '}
        <button type="button" className="font-bold underline underline-offset-2" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Hide checklist' : 'Show checklist'}</button>
      </p>
      {open && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Authentication: unique strong secrets, HTTPS only, password policy, MFA and account recovery.</li>
          <li>Persistent storage: managed MongoDB with backups (Atlas) - not a local dev database.</li>
          <li>Image storage: hosted storage (e.g. Cloudinary / S3) instead of local disk.</li>
          <li>Server-side availability checks: implemented in the API - keep the unique (vehicle, day) index and monitor for lock errors.</li>
          <li>Also: audit logging, monitoring/alerts, email notifications, privacy policy and data-retention rules.</li>
        </ul>
      )}
    </div>
  );
}
