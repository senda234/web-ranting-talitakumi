<script setup lang="ts">
import { computed } from 'vue';
import { useContentStore } from '@/stores/content';
import { MapPin, Instagram } from 'lucide-vue-next';

const contentStore = useContentStore();
const currentYear = computed(() => new Date().getFullYear());
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-content">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-title">{{ contentStore.settings.subBranchName }}</div>
          <div class="footer-subtitle">
            {{ contentStore.settings.organizationName }} · {{ contentStore.settings.branchName }}
          </div>
          <div class="footer-verse">
            “Talita Kum, Hai Anak Muda Bangkitlah!” (Markus 5:41)
          </div>
        </div>

        <div class="footer-contact">
          <div class="contact-item">
            <MapPin :size="16" class="contact-icon" aria-hidden="true" />
            <span>{{ contentStore.settings.address }}</span>
          </div>
          <a
            :href="contentStore.settings.instagramUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="contact-item social-link"
            aria-label="Instagram Ranting Talitakumi"
          >
            <Instagram :size="16" class="contact-icon" aria-hidden="true" />
            <span>@{{ contentStore.settings.instagramHandle }}</span>
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">
          &copy; {{ currentYear }} AMGPM Ranting Talitakumi. Hak cipta dilindungi.
        </p>
        <RouterLink to="/admin/login" class="admin-link">
          Portal Pengurus
        </RouterLink>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: var(--navy);
  color: rgba(255, 255, 255, 0.78);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-8);
  padding-bottom: calc(var(--space-8) + 60px); /* Margin for mobile bottom nav */
  margin-top: auto;
}

@media (min-width: 768px) {
  .site-footer {
    padding-bottom: var(--space-8);
  }
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.footer-top {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

@media (min-width: 768px) {
  .footer-top {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.footer-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--white);
}

.footer-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.65);
}

.footer-verse {
  margin-top: var(--space-2);
  font-size: 0.82rem;
  font-style: italic;
  color: var(--gold);
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.75);
}

.contact-icon {
  color: var(--teal-light);
  flex-shrink: 0;
}

.social-link {
  text-decoration: none;
  transition: color 0.2s ease;
  min-height: var(--touch-target);
}

.social-link:hover {
  color: var(--gold);
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (min-width: 768px) {
  .footer-bottom {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.admin-link {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
}

.admin-link:hover {
  color: var(--gold);
}
</style>

