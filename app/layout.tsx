import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./collections.css";
import "./fonts-bvp.css";
import "./fonts-display.css";
import "./theme.css";
import 'leaflet/dist/leaflet.css';
import { Header,Footer } from '@/components/site';
import { ensureSeed,viewer } from '@/lib/static-data';
import { siteUrl } from '@/lib/site-url';
import { CommandPalette } from '@/components/interactive/command-palette';

export const metadata: Metadata = {
  metadataBase:new URL(siteUrl),
  title:{default:'Nam Bộ Ký Sự — Hành trình qua miền di sản',template:'%s | Nam Bộ Ký Sự'},
  description:'Khám phá văn hóa, địa danh và ký ức Nam Bộ qua những hồ sơ có nguồn tư liệu và trạng thái kiểm chứng rõ ràng.',
  openGraph:{type:'website',locale:'vi_VN',title:'Nam Bộ Ký Sự',description:'Một vùng đất — Ngàn câu chuyện — Muôn hành trình.'},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = { themeColor: '#1E140F' };
export const dynamic='force-dynamic';
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user=null;let unavailable=false;
  try{await ensureSeed();user=await viewer();}catch{unavailable=true;}
  const structuredData=JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'Nam Bộ Ký Sự',url:siteUrl,inLanguage:'vi',description:'Thư viện văn hóa có nguồn tư liệu và trạng thái kiểm chứng.'}).replace(/</g,'\\u003c');
  return (
    <html lang="vi">
      <body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:structuredData}}/><Header user={user}/>{unavailable&&<p className="notice error">Cơ sở dữ liệu chưa sẵn sàng. Vui lòng kiểm tra kết nối và migrations.</p>}{children}<Footer user={user}/><CommandPalette/></body>
    </html>
  );
}
