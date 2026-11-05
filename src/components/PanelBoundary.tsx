import { Button } from './ui';
import { Component, type ReactNode } from 'react';

export default class PanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="empty-state"><h2>This view couldn’t open.</h2><p>Your workspace is still available. Try reloading, or export a backup from the sidebar.</p><Button className="primary-button" onClick={() => location.reload()}>Reload Canvas</Button></div> : this.props.children;
  }
}
