import React from 'react';
import {Button} from 'antd';

export class LoadMoreButton extends React.PureComponent {
  render() {
    const {style, onTouchTap} = this.props;
    return (
      <Button onTouchTap={onTouchTap} style={{backgroundColor: 'transparent', ...style}}>
        加载更多
      </Button>
    )
  }
}
