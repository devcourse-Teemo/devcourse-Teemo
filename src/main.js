import { createApp } from "vue";
import { createPinia } from "pinia";
import "primeicons/primeicons.css";
import Tooltip from "primevue/tooltip";
import PrimeVue from "primevue/config";
import { ConfirmationService } from "primevue";
import ToastService from "primevue/toastservice";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import App from "./App.vue";
import router from "./router";
import "./assets/css/index.css";

import Aura from "@primevue/themes/aura";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: "p",
      darkModeSelector: false || "none",
      cssLayer: false,
    },
  },
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive("tooltip", Tooltip);
app.mount("#app");
