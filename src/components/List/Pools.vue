<template>
  <div>
    <Container v-if="title" class="d-flex flex-items-center px-4 px-md-0 mb-3">
      <h3 class="flex-auto" v-text="title" />
    </Container>
    <UiTable class="table-pools">
      <UiTableTh>
        <div
          v-text="$t('poolAddress')"
          class="column-sm text-left hide-sm hide-md hide-lg"
          style="min-width:110px!important;"
        />
        <div v-text="$t('assets')" class="flex-auto text-left" />
        <div v-text="$t('swapFee')" class="token-column hide-sm hide-md" />
        <div v-html="$t('marketCap')" class="token-market-cap" />
        <div
          v-html="$t('myLiquidity')"
          class="token-column hide-sm hide-md hide-lg"
        />
        <div
          v-html="$t('volume24')"
          class="token-column hide-sm hide-md hide-lg"
        />
      </UiTableTh>
      <div v-infinite-scroll="loadMore" infinite-scroll-distance="10">
        <div v-if="pools.length > 0">
          <ListPool v-for="(pool, i) in pools" :key="i" :pool="pool" />
        </div>
        <UiTableTr v-else-if="!loading">
          <div v-text="$t('emptyState')" />
        </UiTableTr>
        <ListLoading
          v-if="loading"
          :classes="[
            'column-sm text-left hide-sm hide-md hide-lg',
            'flex-auto text-left',
            'column hide-sm hide-md',
            'column',
            'column hide-sm hide-md hide-lg',
            'column hide-sm hide-md hide-lg'
          ]"
          :height="29"
        />
      </div>
    </UiTable>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { formatFilters, ITEMS_PER_PAGE } from '@/helpers/utils';
import { getPoolLiquidity } from '@/helpers/price';

export default {
  props: ['query', 'title'],
  data() {
    return {
      loading: false,
      page: 0,
      pools: [],
      filters: formatFilters(this.$route.query)
    };
  },
  watch: {
    query() {
      this.page = 0;
      this.loading = true;
      this.pools = [];
      this.loadMore();
    },
    filters() {
      if (!this.withFilters) return;
      this.page = 0;
      this.loading = true;
      this.pools = [];
      let query = formatFilters(this.filters);
      if (query.token && query.token.length === 0) query = {};
      query.filter = 1;
      this.$router.push({ query });
      this.loadMore();
    }
  },
  methods: {
    ...mapActions(['getPools']),
    async loadMore() {
      if (this.pools.length < this.page * ITEMS_PER_PAGE) return;
      this.loading = true;
      this.page++;
      const page = this.page;
      let query = this.query || {};
      query = { ...query, page };
      const pools = await this.getPools(query);
      this.pools = this.pools.concat(pools);

      for (let index = 0; index < this.pools.length; index++) {
        this.$set(
          this.pools[index],
          'liquidity',
          getPoolLiquidity(this.pools[index], this.price.values)
        );
      }
      this.loading = false;
    }
  }
};
</script>

<style scoped lang="scss">
.table-pools {
  box-sizing: border-box !important;
  border-radius: 15px !important;

  @media only screen and (max-width: 768px) {
    border-radius: 0 !important;
  }
}
</style>
