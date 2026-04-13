import { describe, expect, it } from 'vitest';
import {
  isWatchProgramEndedText,
  shouldRunEndedBulkHarvest
} from './watchProgramEndState.js';

describe('isWatchProgramEndedText', () => {
  it('公開終了を含むと true', () => {
    expect(isWatchProgramEndedText('この番組は公開終了しました')).toBe(true);
  });

  it('放送終了系キーワードを含むと true', () => {
    expect(isWatchProgramEndedText('放送は終了しました。次回をお楽しみに')).toBe(true);
  });

  it('通常の視聴中文言だけなら false', () => {
    expect(isWatchProgramEndedText('コメント 1234件 視聴中')).toBe(false);
  });
});

describe('shouldRunEndedBulkHarvest', () => {
  it('終了検知かつ未実行ライブなら true', () => {
    expect(
      shouldRunEndedBulkHarvest({
        recording: true,
        liveId: 'lv1',
        locationAllows: true,
        endedDetected: true,
        lastTriggeredLiveId: ''
      })
    ).toBe(true);
  });

  it('同じ liveId で実行済みなら false', () => {
    expect(
      shouldRunEndedBulkHarvest({
        recording: true,
        liveId: 'lv1',
        locationAllows: true,
        endedDetected: true,
        lastTriggeredLiveId: 'lv1'
      })
    ).toBe(false);
  });

  it('recording/location/liveId 条件を満たさないと false', () => {
    expect(
      shouldRunEndedBulkHarvest({
        recording: false,
        liveId: 'lv1',
        locationAllows: true,
        endedDetected: true,
        lastTriggeredLiveId: ''
      })
    ).toBe(false);
    expect(
      shouldRunEndedBulkHarvest({
        recording: true,
        liveId: '',
        locationAllows: true,
        endedDetected: true,
        lastTriggeredLiveId: ''
      })
    ).toBe(false);
    expect(
      shouldRunEndedBulkHarvest({
        recording: true,
        liveId: 'lv1',
        locationAllows: false,
        endedDetected: true,
        lastTriggeredLiveId: ''
      })
    ).toBe(false);
  });
});
