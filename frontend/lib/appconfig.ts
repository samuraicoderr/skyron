
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
  appName: 'melodii',
  tagline: 'Ghostwring because why not.',

  logos: {
    // I know green maps to purple, leave it like that.
    main: "/app-logos/melodii-logo-main1.png",
    green: '/app-logos/melodii-logo-purple.png',
    dark: '/app-logos/melodii-logo-black.png',
    white: '/app-logos/melodii-logo-white.png',
    grey: '/app-logos/melodii-logo-grey.png',
    green_svg: '/app-logos/melodii-logo-purple.svg',
    dark_svg: '/app-logos/melodii-logo-black.svg',
    white_svg: '/app-logos/melodii-logo-white.svg',
    grey_svg: '/app-logos/melodii-logo-grey.svg',
    favicons: {
      main: '/app-logos/favicons/melodii-favicon-main.ico',
      green: '/app-logos/favicons/melodii-logo-purple.ico',
      dark: '/app-logos/favicons/melodii-logo-black.ico',
      white: '/app-logos/favicons/melodii-logo-white.ico',
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
