import { Box, Divider, Flex, Select, Spacer } from '@chakra-ui/react';
import { focusMetatileIDAtom, layerState, metatileSheet } from './state';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { MetatileSheet } from './components/MetatileSheet';
import { Screen } from './components/Screen';
import { LayerViewer } from './components/Layer';
import { MetatileDetail } from './components/MetatileDetail';
import { useEffect, useState } from 'react';

export const LevelEditor = () => {
  const metatileID = useRecoilValue(focusMetatileIDAtom);
  const [sheetURL, setSheet] = useRecoilState(metatileSheet);
  const setLayer = useSetRecoilState(layerState);
  const [list, setList] = useState<string[]>([]);
  const [stage, setStage] = useState<string>('spacecraft');

  const loadStage = async (stage: string) => {
    const { ok, data } = await window.electron.ipcRenderer.invoke('load-stage', stage);
    if (!ok) return;
    setSheet(data[0]);
    setLayer(data[1]);
  };

  const getStageList = async () => {
    const { ok, data } = await window.electron.ipcRenderer.invoke('get-stage-list');
    if (!ok) return;
    setList(data);
  };

  useEffect(() => {
    loadStage(stage);
    getStageList();
  }, []);

  useEffect(() => {
    loadStage(stage);
  }, [stage]);

  return (
    <>
      <Box mx={4}>
        <Select
          placeholder="Select stage"
          onChange={(e) => {
            setStage(e.target.value);
          }}
        >
          {list.map((stage) => {
            return (
              <option key={stage} value={stage}>
                {stage}
              </option>
            );
          })}
        </Select>
      </Box>

      <Spacer h={4} />

      <Flex columnGap="4" mx={4}>
        <Box>
          <LayerViewer />
          <Spacer h={4} />
          <Screen />
        </Box>

        <Divider orientation="vertical" h="auto" />

        <Box>
          <MetatileDetail sheetURL={sheetURL} metatileID={metatileID} />
          <Spacer h={4} />
          <MetatileSheet sheetURL={sheetURL} />
        </Box>
      </Flex>
    </>
  );
};
