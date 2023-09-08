import { Box, Select, Spacer, Wrap, WrapItem, Text, Image } from '@chakra-ui/react';
import { useAnimationFrame } from 'framer-motion';
import { useEffect, useState } from 'react';

type SpriteFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
};

type Sequence = {
  frameIdx: number;
  duration: number;
}[];

type SpriteAbout = {
  name: string;
  id: number;
  path: string;
};

export const SpriteEditor = () => {
  const [size, setSize] = useState<[number, number]>([64, 64]); // [width, height]
  const [frames, setFrames] = useState<SpriteFrame[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]); // [frameIdx, frameIdx, ...
  const [selectedSeuqence, setSelectedSequence] = useState<number>(-1);
  const [list, setList] = useState<SpriteAbout[]>([]);

  useEffect(() => {
    getSpriteList();
  }, []);

  const loadSprite = async (name: string) => {
    const { ok, data } = await (window.electron.ipcRenderer.invoke('load-sprite', name) as Promise<{
      ok: boolean;
      data: {
        frames: SpriteFrame[];
        sequences: Sequence[];
      };
    }>);
    if (!ok) return;
    setFrames(data.frames);
    setSequences(data.sequences);
    const size: [number, number] = [0, 0];
    for (const m of data.frames) {
      if (m.w > size[0]) size[0] = m.w;
      if (m.h > size[1]) size[1] = m.h;
    }
    setSize(size);
  };

  const getSpriteList = async () => {
    const { ok, data } = await window.electron.ipcRenderer.invoke('get-sprite-list');
    if (!ok) return;
    setList(data);
  };

  return (
    <Box p={4}>
      <Box>
        <Select
          placeholder="Select sprite"
          onChange={(e) => {
            setSelectedSequence(-1);
            loadSprite(e.target.value);
          }}
        >
          {list.map((sprite) => {
            return (
              <option key={sprite.name + `_${sprite.id}`} value={sprite.path}>
                {sprite.name}
              </option>
            );
          })}
        </Select>
      </Box>

      <Spacer h={4} />

      <Box p={4} border="1px" borderRadius="md">
        <Text fontWeight="medium">Preview</Text>
        <Spacer h={2} />
        <Select
          placeholder="Select Animation"
          onChange={(e) => {
            setSelectedSequence(parseInt(e.target.value));
          }}
        >
          {sequences.map((_, i) => {
            return (
              <option key={i} value={i}>
                Animation {i}
              </option>
            );
          })}
        </Select>

        <Box p={4}>
          <Box w={`${size[0]}px`} h={`${size[1]}px`}>
            {selectedSeuqence !== -1 && selectedSeuqence < sequences.length && <SpriteAnimation frames={frames} seq={sequences[selectedSeuqence]} w={size[0]} h={size[1]} />}
          </Box>
        </Box>
      </Box>

      <Spacer h={4} />

      <Box p={4} border="1px" borderRadius="md">
        <Text fontWeight="medium">Animation Frames</Text>
        <Spacer h={2} />
        <Wrap spacing="16px">
          {frames.map((frame, i) => {
            return (
              <WrapItem key={i}>
                <Box key={i} border="1px" p={2}>
                  <img src={frame.url} />
                  <Text fontSize="xs">{i}</Text>
                </Box>
              </WrapItem>
            );
          })}
        </Wrap>
      </Box>
    </Box>
  );
};

const SpriteAnimation: React.FC<{ frames: SpriteFrame[]; seq: Sequence; w: number; h: number }> = (props) => {
  const [frame, setFrame] = useState<number>(0);
  const [url, setUrl] = useState<string>('');

  let animationLength = 0;
  for (const seq of props.seq) {
    if (seq.duration !== 254 && seq.duration !== 255) {
      animationLength += seq.duration;
    } else {
      break;
    }
  }

  useAnimationFrame(() => {
    setFrame((frame) => (frame + 1) % animationLength);
  });

  useEffect(() => {
    let seqIndex = 0;
    let frameCount = 0;
    for (const seq of props.seq) {
      if (seq.duration !== 254 && seq.duration !== 255) {
        frameCount += seq.duration;
      }
      if (frameCount > frame) {
        break;
      }
      seqIndex++;
    }

    console.log(seqIndex, props.seq, props.frames);
    const frameIdx = props.seq[seqIndex].frameIdx;
    setUrl(props.frames[frameIdx].url);
  }, [frame]);
  return <Image src={url} w={`${props.w}px`} h={`${props.h}px`} />;
};
