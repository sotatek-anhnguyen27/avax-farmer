import Vue from 'vue';
import VueI18n from 'vue-i18n';
import messages from '@/locales';
import Storage from '@/utils/storage';

Vue.use(VueI18n);

const locale = Storage.getLanguage() || 'en-US';

export default new VueI18n({
  locale,
  messages,
  dateTimeFormats: {
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric'
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }
    }
  }
});
