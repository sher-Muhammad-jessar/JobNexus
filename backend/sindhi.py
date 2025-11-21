import os

BASE_FOLDER = r"G:\.shortcut-targets-by-id\1bHOhBpm7QZJc624GC_IlI-dY0sheCQ6V\batch_1\audio"

def rename_only_top_folders(base_folder):
    renamed = 0

    # Only list direct items inside transcripts folder
    for fname in os.listdir(base_folder):
        old_path = os.path.join(base_folder, fname)

        # Check if this item is a folder AND follows the pattern
        if os.path.isdir(old_path) and fname.startswith("intern_"):

            # If already has suffix, skip
            if fname.endswith("_Audio"):
                print(f"⏭ Already renamed, skipping: {fname}")
                continue

            new_name = f"{fname}_Audio"
            new_path = os.path.join(base_folder, new_name)

            # Safety check: do not overwrite
            if os.path.exists(new_path):
                print(f"⚠️ Skipped (folder exists): {new_name}")
                continue

            os.rename(old_path, new_path)
            renamed += 1
            print(f"🔁 Renamed: {fname} → {new_name}")

    print(f"\n✅ Done! Total folders renamed: {renamed}")

if __name__ == "__main__":
    rename_only_top_folders(BASE_FOLDER)
