import { config } from "../config.ts";
import { Context } from "../context.ts";
import { autocmd, vars } from "../deps.ts";
import { currentLibrary } from "../jisyo.ts";
import { hiraToHanKata } from "../kana/hira_hankata.ts";
import { hiraToKata } from "../kana/hira_kata.ts";
import { resetState } from "../state.ts";
import { kakuteiFeed } from "./input.ts";

export async function modeChange(context: Context, mode: string) {
  context.mode = mode;
  const d = context.denops;
  if (d) {
    await vars.g.set(d, "skkeleton#mode", mode);
    try {
      await autocmd.emit(d, "User", "skkeleton-mode-changed", {
        nomodeline: true,
      });
    } catch {
      // ignore
    }
  }
}

export async function katakana(context: Context) {
  if (context.state.type !== "input") {
    return;
  }
  const state = context.state;
  if (state.mode === "direct") {
    if (state.converter) {
      state.converter = void 0;
      await modeChange(context, "hira");
    } else {
      state.converter = hiraToKata;
      state.converterName = "katakana";
      await modeChange(context, "kata");
    }
    return;
  }
  kakuteiFeed(context);
  const kana = state.henkanFeed + state.okuriFeed;
  let result = kana;
  if (!state.converter) {
    result = hiraToKata(result);
    if (config.registerConvertResult) {
      const lib = currentLibrary.get();
      await lib.registerCandidate("okurinasi", kana, result);
    }
  }
  context.kakuteiWithUndoPoint(result);
  resetState(state);
}

export async function hankatakana(context: Context) {
  if (context.state.type !== "input") {
    return;
  }
  const state = context.state;
  if (state.mode === "direct") {
    if (state.converter === hiraToHanKata) {
      state.converter = void 0;
      await modeChange(context, "hira");
    } else {
      state.converter = hiraToHanKata;
      state.converterName = "hankatakana";
      await modeChange(context, "hankata");
    }
    return;
  }
  kakuteiFeed(context);
  const kana = state.henkanFeed + state.okuriFeed;
  let result = kana;
  if (state.converter !== hiraToHanKata) {
    result = hiraToHanKata(result);
    if (config.registerConvertResult) {
      const lib = currentLibrary.get();
      await lib.registerCandidate("okurinasi", kana, result);
    }
  }
  context.kakuteiWithUndoPoint(result);
  resetState(state);
}
