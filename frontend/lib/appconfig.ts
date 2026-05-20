
// ─────────────────────────────────────────────
// App Configuration
// ─────────────────────────────────────────────

import { Random } from "@/lib/utilities/Random";


const bgs: Record<string, string> = {

};

for (let i=0; i<8; i++) {
  bgs[`bg${i+1}`] = `/backgrounds/bg${i+1}.jpg`;
}

const appConfig = {
  appName: 'Layon',
  tagline: 'Ghostwring because why not.',

  logos: {
    // I know green maps to purple, leave it like that.
    main: "/app-logos/layon-logo-main1.png",
    green: '/app-logos/layon-logo-purple.png',
    dark: '/app-logos/layon-logo-black.png',
    white: '/app-logos/layon-logo-white.png',
    grey: '/app-logos/layon-logo-grey.png',
    green_svg: '/app-logos/layon-logo-purple.svg',
    dark_svg: '/app-logos/layon-logo-black.svg',
    white_svg: '/app-logos/layon-logo-white.svg',
    grey_svg: '/app-logos/layon-logo-grey.svg',
    favicons: {
      main: '/app-logos/favicons/layon-favicon-main.ico',
      green: '/app-logos/favicons/layon-logo-purple.ico',
      dark: '/app-logos/favicons/layon-logo-black.ico',
      white: '/app-logos/favicons/layon-logo-white.ico',
    },
  },

  media: {
    avatarExample: '/media/avatars/samuraicoderr.png',
    defaultAvatar: '/media/avatars/default-avatar.png',
  },

  fonts: {
    logoFont: '/fonts/Bobbleboddy.ttf',
  },

  backgrounds: <Record<string, string>>{
    ...bgs,
  }
} as const;

export default appConfig;


export const randomBG: () => string = () => appConfig.backgrounds[Random.choice(Object.keys(appConfig.backgrounds))]
