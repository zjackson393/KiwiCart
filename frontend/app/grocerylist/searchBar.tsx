import styles from "./groceryList.module.css";
import Icon from "@/app/components/Icon";

interface Props {
    onSearch: (value: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
    return (
        <div className={styles.searchWrap}>
            <Icon name="search" size={18} className={styles.searchIcon} />
            <input
                id="searchBar"
                type="text"
                placeholder="Search items…"
                onChange={(e) => onSearch(e.target.value)}
                className={styles.searchInput}
            />
        </div>
    );
}
