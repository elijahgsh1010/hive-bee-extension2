<script setup lang="ts">

const isLoggedIn = ref(false);
const isShowPanel = ref(false);

onMounted(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "CHECK_IFRAME_STATE" },
        (response: { isVisible?: boolean }) => {
          if (response?.isVisible) {
            showPanel();
          }
        }
      );
    }
  });

  chrome.storage.local.get('hiveAccessToken', function (result) {
    if(result.hiveAccessToken){
      isLoggedIn.value = true;
    }
  })
  
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
          <h1>Hello</h1>

          <a
              href="https://dev.hive.hrnetgroup.com"
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
              Show Panel
            </button>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
