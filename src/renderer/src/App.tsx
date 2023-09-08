import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LevelEditor } from './LevelEditor';
import { SpriteEditor } from './SpriteEditor';
import { Box, Button, ButtonGroup } from '@chakra-ui/react';
import { Header } from './Header';

const App = () => {
  const navigate = useNavigate();

  const onClick = async () => {
    const { ok, data } = await window.electron.ipcRenderer.invoke('load-project');
    if (!ok) return;

    navigate(`/level`);
  };

  return (
    <Box h="100vh">
      <Header>
        <Routes>
          <Route
            path={`/top`}
            element={
              <Button colorScheme="teal" onClick={onClick}>
                Load Project
              </Button>
            }
          />
          <Route path="*" element={<Tablist />} />
        </Routes>
      </Header>

      <Routes>
        <Route path={`/top`} element={<></>} />
        <Route path={`/sprite`} element={<SpriteEditor />} />
        <Route path={`/level`} element={<LevelEditor />} />
        <Route path="*" element={<Navigate to={`/top`} replace />} />
      </Routes>
    </Box>
  );
};

const Tablist = () => {
  const navigate = useNavigate();

  return (
    <ButtonGroup gap="4">
      <Button
        colorScheme="teal"
        onClick={() => {
          navigate('/level');
        }}
      >
        Level
      </Button>
      <Button
        colorScheme="teal"
        onClick={() => {
          navigate('/sprite');
        }}
      >
        Sprite
      </Button>
    </ButtonGroup>
  );
};

export default App;
