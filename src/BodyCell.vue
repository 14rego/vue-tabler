<script setup lang="ts">
import { computed, onMounted, ref, type PropType } from "vue";
import { cloneDeep, get } from "lodash";
import { TablerDefaults } from "./store";
import type { TablerColumnDto } from "./types";

const props = defineProps({
    col: {
        type: Object as PropType<TablerColumnDto>,
        default: () => cloneDeep(TablerDefaults.columns),
    },
    row: {
        type: Object as PropType<Record<string, any>>,
        default: () => ({}),        
    },
});

const emit = defineEmits<{ (e: "click", ev?: MouseEvent): void }>();

const col = computed(() => props.col ?? cloneDeep(TablerDefaults.columns));
const transformed = ref<string>("");

const defaultHTML = (row: Record<string, any>): string => {
    const v = get(row, col.value.data.column);
    if (v == null || v == "null") return ``;
    return `<div class="${col.value.style.body.classes}">${v}</div>`;
};

onMounted(() => {
    transformed.value =
        col.value.style.body.formatter != null
            ? col.value.style.body.formatter(props.row)
            : defaultHTML(props.row);
});
</script>
<template>
    <td
        :class="`text-${col.value.style.body.xAlign} ${col.value.style.body.formatter ? col.value.style.body.classes : ''}`"
        :valign="col.value.style.body.yAlign"
        v-html="transformed"
    ></td>
</template>
