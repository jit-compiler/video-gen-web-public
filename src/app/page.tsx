import Image from 'next/image'
import styles from './page.module.css'
import Trivia from "@/components/Trivia"

export default function Home() {
  return (
    <main className={styles.main}>
     <Trivia />
    </main>
  )
}
