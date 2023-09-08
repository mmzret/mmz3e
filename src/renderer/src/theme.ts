import { ThemeConfig, extendTheme } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark', // 'dark' | 'light'
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  components: {
    FormLabel: {
      baseStyle: {
        fontSize: 'sm',
      },
    },
  },
});

export default theme;
