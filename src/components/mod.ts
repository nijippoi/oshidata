import Component, { addMaterialSymbolsLink } from './component.ts';
import Container from './container.ts';
import LocaleSelector from './locale-selector.ts';
import Multiselect from './multiselect.ts';
import PersonCard from './person-card.ts';
import PersonsList from './persons-list.ts';
import RadioIcons from './radio-icons.ts';
import Toolbar from './toolbar.ts';

export { Component, Container, LocaleSelector, Multiselect, PersonCard, PersonsList, RadioIcons, Toolbar };

export function registerAll(): void {
  addMaterialSymbolsLink();
  Container.register();
  LocaleSelector.register();
  Multiselect.register();
  PersonCard.register();
  PersonsList.register();
  RadioIcons.register();
  Toolbar.register();
}
