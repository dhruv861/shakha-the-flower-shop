import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Shakha Admin", template: "%s · Shakha Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
