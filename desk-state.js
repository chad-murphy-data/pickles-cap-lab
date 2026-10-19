// Round six starts immediately after the last round-five pick is displayed.
export const rankingsSealed=state=>!!state&&state.turn>=100&&state.turn<120;
