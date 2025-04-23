<script setup lang="ts">

import {$api} from "src/utils/api";

const isLoggedIn = ref(false);
const isShowPanel = ref(false);
const userName = ref('');
const url = import.meta.env.VITE_BASE_URL;

onMounted(async () => {

  chrome.storage.local.get('showPanel', async function (result) {
    if(result.showPanel){
      isShowPanel.value = true;
    }
  })

  chrome.storage.local.get(['hiveAccessToken'], function(result) {
    localStorage.setItem('hiveAccessToken', result.hiveAccessToken);
  });
  
  if(localStorage.getItem('hiveAccessToken')){
    isLoggedIn.value = true;
  }

  let res = await $api(`/api/userApp/get-user-basic-info`, { method: 'GET' });
  userName.value = res.username;
  
})

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
            <h1>Hello</h1>
            <p> {{ userName }} </p>
          </div>
          
          <a
            :href="url"
            class="btn btn-secondary btn-lg"
            v-if="!isLoggedIn"
            target="_blank"
          >
          <i-ph-rocket-launch />
            Login Now
          </a>

          <br />

          <div class="max-w-md mt-4">
            <button class="btn btn-primary btn-lg" @click="showPanel" v-if="!isShowPanel">
              Show Profile Panel
            </button>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
