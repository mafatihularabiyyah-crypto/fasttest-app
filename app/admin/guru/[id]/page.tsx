// File: app/admin/guru/[id]/page.tsx
export const runtime = 'edge'; // Cloudflare bahagia melihat ini

import ClientUI from "./ClientUI"; // Mengambil tampilan UI Ustadz

export default function Page() {
  return <ClientUI />;
}