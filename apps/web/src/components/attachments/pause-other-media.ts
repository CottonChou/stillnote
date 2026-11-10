const MEDIA_PLAYER_SELECTOR = "audio[data-stillnote-audio-player], video[data-stillnote-video-player]";

export const pauseOtherMediaPlayers = (activePlayer: HTMLMediaElement) => {
  activePlayer.ownerDocument
    .querySelectorAll<HTMLMediaElement>(MEDIA_PLAYER_SELECTOR)
    .forEach((player) => {
      if (player !== activePlayer) player.pause();
    });
};
