<template>
  <BaseToast />
  <AppConfirmDialog />
  <router-view />
</template>

<script setup lang="ts">
import BaseToast from '@/shared/components/toast/components/BaseToast.vue';
import AppConfirmDialog from '@/shared/components/confirm/components/AppConfirmDialog.vue';
</script>
