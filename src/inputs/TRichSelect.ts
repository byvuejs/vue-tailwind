import TRichSelectType from '@/types/TRichSelect';
import { CreateElement, VNode } from 'vue';
import NormalizedOption from '../types/NormalizedOption';
import NormalizedOptions from '../types/NormalizedOptions';
import TSelect from './TSelect';
import Render from './TRichSelect/Render';

const TRichSelect = TSelect.extend({
  name: 'TRichSelect',

  render(createElement) {
    const createSelectFunc: (createElement: CreateElement) => VNode = this.createSelect;
    return createSelectFunc(createElement);
  },

  props: {
    value: {
      type: [String, Number],
      default: null,
    },
    hideSearchBox: {
      type: Boolean,
      default: false,
    },
    openOnFocus: {
      type: Boolean,
      default: true,
    },
    searchBoxPlaceholder: {
      type: String,
      default: 'Search...',
    },
    noResultsLabel: {
      type: String,
      default: 'No results found',
    },
    maxHeight: {
      type: [String, Number],
      default: 300,
    },
    classes: {
      type: Object,
      default() {
        return {
          wrapper: 'relative',
          buttonWrapper: 'inline-block w-full',
          selectButton: 'w-full',
          dropdown: 'absolute mt-1 w-full rounded-md bg-white shadow-lg z-10',
          dropdownFeedback: 'rounded-md p-2 text-base leading-6 shadow-xs focus:outline-none sm:text-sm sm:leading-5',
          optionsList: 'rounded-md py-1 text-base leading-6 shadow-xs overflow-auto focus:outline-none sm:text-sm sm:leading-5',
          searchWrapper: 'inline-block w-full',
          searchBox: 'inline-block w-full border p-2',
          option: 'cursor-default select-none relative p-2 text-gray-900',
          highlightedOption: 'cursor-default select-none relative p-2 text-white bg-orange-500',
          selectedOption: 'cursor-default select-none relative p-2 text-gray-900 font-semibold bg-orange-100',
          selectedHighlightedOption: 'cursor-default select-none relative p-2 text-white bg-orange-500 font-semibold',
          optionContent: 'flex justify-between items-center',
          optionLabel: 'truncate block',
          selectedIcon: 'fill-current h-4 w-4',
        };
      },
    },
  },

  data() {
    return {
      hasFocus: false,
      show: false,
      localValue: this.value,
      highlighted: null as number | null,
      query: '',
      filteredOptions: [] as NormalizedOptions,
    };
  },

  watch: {
    normalizedOptions: {
      handler(options) {
        this.filteredOptions = options;
      },
      immediate: true,
    },
    query() {
      this.filterOptions();
    },
    async localValue(localValue: string | null) {
      this.$emit('input', localValue);

      await this.$nextTick();

      this.$emit('change', localValue);

      this.show = false;
    },
    value(value) {
      this.localValue = value;
    },
    async show(show) {
      if (show) {
        if (!this.hideSearchBox) {
          await this.$nextTick();
          this.getSearchBox().focus();
        }

        if (!this.filteredOptions.length) {
          this.highlighted = null;
          return;
        }

        this.highlighted = this.selectedOptionIndex || 0;
      }
    },
  },

  computed: {
    normalizedHeight(): string {
      if (/^\d+$/.test(String(this.maxHeight))) {
        return `${this.maxHeight}px`;
      }

      return String(this.maxHeight);
    },
    selectedOptionIndex(): number | undefined {
      const index = this.filteredOptions.findIndex((option) => this.optionIsSelected(option));
      return index >= 0 ? index : undefined;
    },
  },

  methods: {
    createSelect(createElement: CreateElement) {
      return (new Render(createElement, this as TRichSelectType)).render();
    },
    filterOptions() {
      if (!this.query) {
        this.filteredOptions = this.normalizedOptions;
      }

      this.filteredOptions = this.normalizedOptions
        .filter((option: NormalizedOption) => String(option.text)
          .toUpperCase().trim().includes(this.query.toUpperCase().trim()));

      if (this.filteredOptions.length) {
        this.highlighted = 0;
      } else {
        this.highlighted = null;
      }
    },
    optionIsSelected(option: NormalizedOption): boolean {
      return Array.isArray(this.value)
        ? this.value.includes(option.value)
        : this.value === option.value;
    },
    hideOptions() {
      this.show = false;
    },
    showOptions() {
      this.show = true;
    },
    toggleOptions() {
      if (this.show) {
        this.hideOptions();
      } else {
        this.showOptions();
      }
    },
    blurHandler(e: FocusEvent) {
      this.hasFocus = false;
      this.hideOptions();
      this.$emit('blur', e);
    },
    focusHandler(e: FocusEvent) {
      this.hasFocus = true;
      if (this.openOnFocus) {
        this.showOptions();
      }
      this.$emit('focus', e);
    },
    clickHandler(e: FocusEvent) {
      if (!this.show && !this.hasFocus) {
        this.getButton().focus();
        if (!this.openOnFocus) {
          this.showOptions();
        }
      } else {
        this.toggleOptions();
      }
      this.$emit('click', e);
    },
    async arrowUpHandler(e: KeyboardEvent) {
      e.preventDefault();

      if (!this.show) {
        this.showOptions();
        return;
      }

      if (this.highlighted === null) {
        this.highlighted = 0;
      } else {
        this.highlighted = this.highlighted - 1 < 0
          ? this.filteredOptions.length - 1
          : this.highlighted - 1;
      }
      if (this.$refs.list) {
        (this.$refs.list as HTMLUListElement).children[this.highlighted].scrollIntoView({ block: 'nearest' });
      }
    },
    arrowDownHandler(e: KeyboardEvent) {
      e.preventDefault();

      if (!this.show) {
        this.showOptions();
        return;
      }

      if (this.highlighted === null) {
        this.highlighted = 0;
      } else {
        this.highlighted = this.highlighted + 1 >= this.filteredOptions.length
          ? 0
          : this.highlighted + 1;
      }

      if (this.$refs.list) {
        (this.$refs.list as HTMLUListElement).children[this.highlighted].scrollIntoView({ block: 'nearest' });
      }
    },
    enterHandler(e: KeyboardEvent) {
      if (!this.show) {
        return;
      }

      if (this.highlighted !== null) {
        e.preventDefault();
        const option = this.filteredOptions[this.highlighted];
        this.selectOption(option);
      }
    },
    searchInputHandler(e: Event): void {
      const target = (e.target as HTMLInputElement);
      this.query = target.value;
    },
    getButton() {
      return this.$refs.selectButton as HTMLButtonElement;
    },
    getSearchBox() {
      return this.$refs.searchBox as HTMLInputElement;
    },
    async selectOption(option: NormalizedOption) {
      if (this.localValue !== option.value) {
        this.localValue = option.value as string | number;
      }
      await this.$nextTick();
      this.getButton().focus();
      this.hideOptions();
      this.query = '';
    },
  },
});


export default TRichSelect;