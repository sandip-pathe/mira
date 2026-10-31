import type { SessionDescriptionHandler } from 'sip.js';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import type { MediaStream } from 'react-native-webrtc';

/** SIP.js signaling with native media. No DOM, HTML audio, or browser SDK. */
export class NativeCallMedia implements SessionDescriptionHandler {
  readonly pc: RTCPeerConnection;
  private closed = false;
  private cancelGathering?: () => void;

  constructor(iceServers: RTCIceServer[], private stream: MediaStream) {
    this.pc = new RTCPeerConnection({ iceServers });
    stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
  }

  hasDescription(contentType: string) { return contentType.toLowerCase() === 'application/sdp'; }
  sendDtmf() { return false; }

  async getDescription() {
    if (this.closed) throw new Error('Call ended');
    const answer = this.pc.signalingState === 'have-remote-offer';
    const description = answer ? await this.pc.createAnswer() : await this.pc.createOffer({});
    await this.pc.setLocalDescription(description);
    // SIP is non-trickle. Include gathered candidates in the INVITE/answer.
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        this.pc.onicegatheringstatechange = null;
        this.cancelGathering = undefined;
        resolve();
      };
      const onChange = () => { if (this.pc.iceGatheringState === 'complete') finish(); };
      const timer = setTimeout(finish, 2000);
      this.cancelGathering = finish;
      this.pc.onicegatheringstatechange = onChange;
      onChange();
    });
    if (this.closed || !this.pc.localDescription?.sdp) throw new Error('Call ended');
    return { body: this.pc.localDescription.sdp, contentType: 'application/sdp' };
  }

  async setDescription(sdp: string) {
    if (this.closed) throw new Error('Call ended');
    await this.pc.setRemoteDescription(new RTCSessionDescription({
      type: this.pc.signalingState === 'have-local-offer' ? 'answer' : 'offer', sdp,
    }));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.cancelGathering?.();
    this.stream.getTracks().forEach(track => track.stop());
    this.pc.close();
  }
}
