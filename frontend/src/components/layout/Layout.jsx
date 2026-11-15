import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import styles from './Layout.module.css';
import { NavBar } from './NavBar.jsx';
import { TabBar } from './TabBar.jsx';

/** The frame around every page: navigation bar, page content, footer and the phone tab bar. */
export function Layout() {
  const { pathname } = useLocation();

  // Start each new page at the top, like a normal website.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <NavBar />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <p>WatchNext, a CPIT-405 student project</p>
          <p>
            Movie details from <a href="https://www.omdbapi.com/">OMDb</a>. Recommendations learned from{' '}
            <a href="https://grouplens.org/datasets/movielens/">MovieLens</a> ratings. Series and directors from{' '}
            <a href="https://www.wikidata.org/">Wikidata</a>.
          </p>
        </div>
      </footer>
      <TabBar />
    </div>
  );
}
