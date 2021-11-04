import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: 'Inter, Noto Sans KR',
    body: 'Inter, Noto Sans KR',
  },
  initialColorMode: 'dark',
});

export default theme;