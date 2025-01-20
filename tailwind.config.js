const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        //팀컬러
        orange: {
          1: "#F1A140", // Orange-1
          2: "#F6C085", // Orange-2
          3: "#FBE1C0", // Orange-3
          hover: "#E28B30",
        },
        //배경색
        beige: {
          1: "#F7F3E9", // Beige-1
          2: "#FAF8F1", // Beige-2
        },
        black: {
          1: "#1A1A1A", // default
          2: "#414860",
          3: "#1E2338",
          4: "#D4D4D4",
          5: "#E5E4E6",
        },
        navy: {
          1: "#1E2338",
          2: "#414860",
          3: "#6A718B",
          4: "#8992B5",
        },
        gray: {
          1: "#777777",
          2: "#4F4F4F",
          3: "#B1B1B1",
        },
      },
      fontFamily: {
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
        laundry: ["LaundryGothic", "sans-serif"],
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
