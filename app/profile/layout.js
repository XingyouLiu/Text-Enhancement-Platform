// app/profile/layout.js
import Header from "@/components/Header";

export default function ProfileLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
