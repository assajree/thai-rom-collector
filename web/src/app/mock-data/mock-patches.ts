import { Patch } from '../models/patch.models';

export const MOCK_PATCHES: readonly Patch[] = [
  {
    id: 'mock-ocarina-3ds',
    updateDate: '2024-03-15T00:00:00.000Z',
    fileName: 'Ocarina_of_Time_3D_TH_v1.0.xdelta',
    gameTitle: 'The Legend of Zelda: Ocarina of Time 3D',
    system: '3DS',
    translatorId: 'mock-siam-quest',
    translatedBy: 'Siam Quest Team',
    patchTool: 'xDelta UI',
    tags: ['RPG', 'Adventure'],
    coverUrl: '',
    patchFileUrl: '#mock-download-ocarina'
  },
  {
    id: 'mock-mother-gba',
    updateDate: '2024-02-15T00:00:00.000Z',
    fileName: 'Mother_3_TH_v0.9.ips',
    gameTitle: 'Mother 3',
    system: 'GBA',
    translatorId: 'mock-pixel-thai',
    translatedBy: 'Pixel Thai',
    patchTool: 'FLIPS',
    tags: ['RPG', 'Story'],
    coverUrl: '',
    patchFileUrl: '#mock-download-mother'
  },
  {
    id: 'mock-patapon-psp',
    updateDate: '2024-01-15T00:00:00.000Z',
    fileName: 'Patapon_TH_v1.2.ppf',
    gameTitle: 'Patapon',
    system: 'PSP',
    translatorId: 'mock-rhythm-lab',
    translatedBy: 'Rhythm Lab TH',
    patchTool: 'PPF-O-Matic',
    tags: ['Rhythm', 'Action'],
    coverUrl: '',
    patchFileUrl: '#mock-download-patapon'
  }
];
