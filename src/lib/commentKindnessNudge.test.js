import { describe, expect, it } from 'vitest';
import { detectCommentKindnessNudge } from './commentKindnessNudge.js';

describe('detectCommentKindnessNudge', () => {
  it('強い攻撃語は strong を返す', () => {
    expect(detectCommentKindnessNudge('ほんと死ねよ')).toMatchObject({
      level: 'strong',
      title: 'りんくから、ひとこと'
    });
  });

  it('やや強い誹謗語は mild を返す', () => {
    expect(detectCommentKindnessNudge('きもいって言うのはやめて')).toMatchObject({
      level: 'mild',
      title: 'りんくから、ひとこと'
    });
  });

  it('日常語の誤検知は避ける', () => {
    expect(detectCommentKindnessNudge('ゴミ箱を片付けた')).toBeNull();
    expect(detectCommentKindnessNudge('この商品めっちゃバカ売れしてる')).toBeNull();
    expect(detectCommentKindnessNudge('アホ毛がぴょんってしてる')).toBeNull();
  });

  it('空や通常の応援コメントは null', () => {
    expect(detectCommentKindnessNudge('')).toBeNull();
    expect(detectCommentKindnessNudge('今日も配信ありがとう！')).toBeNull();
  });
});
