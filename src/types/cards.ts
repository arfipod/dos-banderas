export type CardType =
  | 'Starter'
  | 'Capital Sin'
  | 'Virtue'
  | 'Gift of the Holy Spirit'
  | 'Sacrament'
  | 'Dark Banner'
  | 'Mystery'
  | 'Ally'
  | 'Weapon of Light'
  | 'Life Trial';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  subtype: string;
  cost: number | null;
  light: number | null;
  fervor: number | null;
  text: string;
  tags: string[];
}

export interface RuntimeCard extends Card {
  uid: string;
}
