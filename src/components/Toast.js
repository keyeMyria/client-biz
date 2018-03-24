import React from 'react';
import { observable, computed, action } from 'mobx';
import { message } from 'antd';

class Store {
  @observable message = '';
  @observable duration = 1500;
  @computed get open() {
    return !!this.message;
  }

  @action show = (text, duration = 1500) => {
    this.message = text;
    this.duration = duration;
    if (text === 'token已过期') {
      window.location.replace('/');
      return;
    }
    message.info(text, duration / 1000);
  };
  @action close = () => {
    this.message = '';
    this.duration = 1500;
  }
}

export const ToastStore = new Store();
