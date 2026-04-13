--
-- export type PlantJournalEntryType =
--     | "watering"
--     | "fertilizing"
--     | "repotting"
--     | "note"
--
-- export interface PlantJournalEntry {
--     id: number
--
--     plantId: number
--
--     type: PlantJournalEntryType
--
--     date: Date
--
--     notes?: string
--
--     images: string[]
-- }
create table if not exists plant_journal_entries (
    id integer primary key autoincrement not null,
    plant_id integer not null,
    journal_entry_type text not null,

    foreign key plant_id references (plants)id on delete cascade,

    created_at not null default current_timestamp,
    updated_at not null default current_timestamp,
);

create table if not exists plant_journal_entries_images (
    id integer primary key autoincrement not null,
    plant_journal_entry_id integer not null,
    url text not null,

    foreign key plant_id references (plants)id on delete cascade
);

