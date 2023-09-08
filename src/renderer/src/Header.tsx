import { Box, Flex, Heading, Spacer } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

export const Header: React.FC<PropsWithChildren<Record<never, any>>> = ({ children }) => {
  return (
    <Flex minWidth="max-content" alignItems="center" gap="2" p="4">
      <Box p="2">
        <Heading size="md">MMZ3E</Heading>
      </Box>
      <Spacer />
      {children}
    </Flex>
  );
};
