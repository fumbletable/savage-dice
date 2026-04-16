import OBR from '@owlbear-rodeo/sdk';

const POPOVER_ID = 'com.fumbletable.savage-dice/overlay';

OBR.onReady(async () => {
  // Open a zero-size transparent popover — it expands when dice are rolling
  await OBR.popover.open({
    id: POPOVER_ID,
    url: '/popover.html',
    width: 0,
    height: 0,
    anchorOrigin: { horizontal: 'RIGHT', vertical: 'BOTTOM' },
    transformOrigin: { horizontal: 'RIGHT', vertical: 'BOTTOM' },
    disableClickAway: true,
    hidePaper: true,
    marginThreshold: 0,
  });
});
