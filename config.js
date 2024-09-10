import themes from "daisyui/src/theming/themes";

const config = {
  colors: {
  theme: ["light", "dark"],
  main: {
    light: themes[`[data-theme=light]`],
    dark: themes[`[data-theme=dark]`],
  },
},
  appName: "Text Enhancement",
  appDescription:
    "",
  domainName: "",
  colors: {
    theme: "light",
    main: themes["light"]["primary"],
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
};

export default config;
