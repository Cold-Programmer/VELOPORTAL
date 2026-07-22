// Pure logic — no DB/Express imports — so it can be unit-tested in isolation
// (see backend/tests/compatibility.test.js). Mirrors the fork/headtube tolerance
// rule and wheel-size matching rule described in the SDS.

const TOLERANCE_MM = 0.05;

/**
 * @param {{headtubeDiameter:number, wheelSize:string}} frame
 * @param {{steererDiameter?:number}|null} fork
 * @param {{wheelSize?:string}|null} wheel
 * @returns {{compatible:boolean, notes:string[]}}
 */
function checkCompatibility({ frame, fork, wheel }) {
  if (!frame) throw new Error('A frame is required to check compatibility');
  const notes = [];
  let compatible = true;

  if (fork) {
    const diff = Math.abs(Number(frame.headtubeDiameter) - Number(fork.steererDiameter));
    if (diff > TOLERANCE_MM) {
      compatible = false;
      notes.push(`Fork steerer (${fork.steererDiameter}mm) does not match frame headtube (${frame.headtubeDiameter}mm) — mechanical size conflict.`);
    } else {
      notes.push(`Fork steerer matches frame headtube within ${TOLERANCE_MM}mm tolerance.`);
    }
  }

  if (wheel) {
    if (wheel.wheelSize !== frame.wheelSize) {
      compatible = false;
      notes.push(`Wheel size (${wheel.wheelSize}) does not match frame wheel size (${frame.wheelSize}).`);
    } else {
      notes.push('Wheel size matches the frame.');
    }
  }

  return { compatible, notes };
}

module.exports = { checkCompatibility, TOLERANCE_MM };
