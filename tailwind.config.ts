import type { Config } from "tailwindcss";

const config: Config = {
  // 어떤 파일들에서 스타일을 찾을지 정하는 규칙입니다.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 나중에 'GeunBang' 만의 특별한 색상을 넣고 싶으면 여기에 추가하면 됩니다!
    },
  },
  // 🚨 바로 이 부분이 '가독성 패키지'를 활성화하는 핵심입니다!
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;