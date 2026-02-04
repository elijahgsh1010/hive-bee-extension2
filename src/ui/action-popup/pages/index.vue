<script setup lang="ts">

import {$api} from "src/utils/api";

const isLoggedIn = ref(false);
const isShowPanel = ref(false);
const userName = ref('');
const url = import.meta.env.VITE_BASE_URL;

onMounted(async () => {
  
  console.log('action popup mounted');

  chrome.storage.local.get('showPanel', async function (result) {
    if(result.showPanel){
      isShowPanel.value = true;
    }
  })

  chrome.storage.local.get(['hiveAccessToken'], function(result) {
    if(result.hiveAccessToken){
      localStorage.setItem('hiveAccessToken', result.hiveAccessToken);
    }
  });
  
  if(localStorage.getItem('hiveAccessToken')){
    isLoggedIn.value = true;
  }

  let res = await $api(`/api/userApp/get-user-basic-info`, { method: 'GET' });
  userName.value = res.username;
})

const login = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "LOGIN" }
      );
    }
  });
}

const showPanel = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SHOW_PANEL" });
      isShowPanel.value = true;
    }
  });
}

const hidePanel = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "HIDE_PANEL" });
      isShowPanel.value = false;
    }
  });
}

</script>

<template>
  <div>
    <div class="hero">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <div>
            <h1 class="hello-text">Hello  <i-ph-smiley class="icon" /></h1>
            <p class="username-text"> {{ userName }} </p>
          </div>
          
          <button
            class="btn btn-secondary btn-lg"
            v-if="!isLoggedIn"
            target="_blank"
            @click="login"
          >
            <i-ph-rocket-launch />
            Login Now
          </button>

          <div class="max-w-md mt-4">
            <button class="btn btn-primary btn-lg" @click="showPanel" v-if="!isShowPanel && isLoggedIn">
              Show Panel
            </button>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.hello-text {
  margin: 0;
  display: flex; 
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.icon {
  width: 24px;  
  height: 24px;
}

.username-text {
  margin-top: 10px;
}

</style>
