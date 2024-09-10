"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { useAuth } from "@/hooks/useAuth"; // Import the custom hook we created

// Crisp customer chat support
const CrispChat = () => {
  const pathname = usePathname();
  const { session } = useAuth(); // Use our custom hook instead of useSession

  useEffect(() => {
    if (config?.crisp?.id) {
      Crisp.configure(config.crisp.id);

      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (session?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: session.user.id });
    }
  }, [session]);

  return null;
};

const ClientLayout = ({ children }) => {
  return (
    <>
      {/* Remove SessionProvider as it's no longer needed */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {children}

      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      <CrispChat />
    </>
  );
};

export default ClientLayout;