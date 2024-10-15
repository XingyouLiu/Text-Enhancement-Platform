// app/forgot-password/layout.js
import Header from "@/components/Header";

export default function ForgotPasswordLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
